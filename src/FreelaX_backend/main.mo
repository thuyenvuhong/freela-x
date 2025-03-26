import Types "./types";
import Nat "mo:base/Nat";
import Bool "mo:base/Bool";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Order "mo:base/Order";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Map "mo:motoko-hash-map/Map";
import Icrc1Ledger "canister:icrc1_ledger_canister";

actor class FreelaX() = this {
  type GigPayload = Types.GigPayload;
  type Gig = Types.Gig;
  type SearchGigFilter = Types.SearchGigFilter;
  type Order = Types.Order;
  type OrderDto = Types.OrderDto;
  type User = Types.User;
  type UserProfile = Types.UserProfile;
  type Message = Types.Message;
  type Conversation = Types.Conversation;
  type ConversationDto = Types.ConversationDto;
  type Review = Types.Review;
  type ReviewPayload = Types.ReviewPayload;
  type ReviewDto = Types.ReviewDto;
  type OrderDeliveryPayload = Types.OrderDeliveryPayload;
  type OrderDelivery = Types.OrderDelivery;

  let { nhash; phash } = Map;

  let TRANSFER_FEE = 10_000;

  stable let gigs : Map.Map<Nat, Gig> = Map.new();
  stable var nextGigId : Nat = 0;
  stable let orders : Map.Map<Nat, Order> = Map.new();
  stable var nextOrderId : Nat = 0;
  stable let users : Map.Map<Principal, User> = Map.new();
  stable let conversations : Map.Map<Nat, Conversation> = Map.new();
  stable var nextConversationId : Nat = 0;
  stable let messages : Map.Map<Nat, [Message]> = Map.new();
  stable let reviews : Map.Map<Nat, [Review]> = Map.new();
  stable let orderDeliveries : Map.Map<Nat, [OrderDelivery]> = Map.new();

  public shared ({ caller }) func acceptDelivery(orderId : Nat) : async () {
    switch (Map.get(orders, nhash, orderId)) {
      case (?order) {
        if (order.buyer != caller) {
          Debug.trap("Unauthorized");
        };
        if (order.status != #Delivered) {
          Debug.trap("Order not delivered yet");
        };
        // transfer tokens to seller
        let amount = order.price * 100_000_000 - TRANSFER_FEE;

        let transferResults = await Icrc1Ledger.icrc1_transfer({
          from_subaccount = null;
          to = {
            owner = order.seller;
            subaccount = null;
          };
          fee = null;
          amount;
          memo = null;
          created_at_time = null;
        });
        switch (transferResults) {
          case (#Ok(block_height)) {};
          case (#Err(err)) { Debug.trap("Transfer failed") };
        };
        // update order status
        Map.set(
          orders,
          nhash,
          orderId,
          { order with status = #Completed },
        );
      };
      case (_) {
        Debug.trap("Order not found");
      };
    };
  };

  public query func getOrderDeliveries(orderId : Nat) : async [OrderDelivery] {
    switch (Map.get(orderDeliveries, nhash, orderId)) {
      case (?orderDeliveries) {
        return orderDeliveries;
      };
      case (_) {
        return [];
      };
    };
  };

  public func deliverOrder(payload : OrderDeliveryPayload) : async () {
    switch (Map.get(orders, nhash, payload.orderId)) {
      case (?order) {
        // append new order delivery
        let newOrderDelivery : OrderDelivery = {
          payload with
          createdAt = Time.now();
        };
        switch (Map.get(orderDeliveries, nhash, payload.orderId)) {
          case (?deliveries) {
            Map.set(orderDeliveries, nhash, payload.orderId, Array.append(deliveries, [newOrderDelivery]));
          };
          case (_) {
            Map.set(orderDeliveries, nhash, payload.orderId, [newOrderDelivery]);
          };
        };
        // update order status
        Map.set(
          orders,
          nhash,
          payload.orderId,
          { order with status = #Delivered },
        );
      };
      case (_) {
        Debug.trap("Order not found");
      };
    };
  };

  public shared ({ caller }) func createReview(payload : ReviewPayload) : async Review {
    let newReview : Review = {
      payload with
      reviewer = caller;
      createdAt = Time.now();
    };
    switch (Map.get(gigs, nhash, payload.gigId)) {
      case (?gig) {
        // append new review
        switch (Map.get(reviews, nhash, payload.gigId)) {
          case (?gigReviews) {
            let existedReview = Array.find<Review>(gigReviews, func(r) = r.reviewer == caller);
            if (existedReview != null) {
              Debug.trap("Already reviewed this gig");
            };
            Map.set(reviews, nhash, payload.gigId, Array.append(gigReviews, [newReview]));
          };
          case (_) {
            Map.set(reviews, nhash, payload.gigId, [newReview]);
          };
        };
        // update gig statistics
        let updatedTotalStars = gig.totalStars + payload.star;
        let updatedStarNumber = gig.starNumber + 1;
        Map.set(
          gigs,
          nhash,
          payload.gigId,
          {
            gig with totalStars = updatedTotalStars;
            starNumber = updatedStarNumber;
          },
        );

        return newReview;
      };
      case null {
        Debug.trap("Gig not found");
      };
    };
  };

  public query func getReviews(gigId : Nat) : async [ReviewDto] {
    switch (Map.get(reviews, nhash, gigId)) {
      case (?reviews) {
        return Array.map<Review, ReviewDto>(
          reviews,
          func(r) {
            switch (Map.get(users, phash, r.reviewer)) {
              case (?user) {
                { r with reviewerProfile = user };
              };
              case (_) {
                Debug.trap("Reviewer not found");
              };
            };
          },
        );
      };
      case (_) {
        return [];
      };
    };
  };

  public shared ({ caller }) func createMessage(conversationId : Nat, content : Text) : async Message {
    switch (Map.get(conversations, nhash, conversationId)) {
      case (?conversation) {
        switch (Map.get(users, phash, caller)) {
          case (?user) {
            // append new message
            let newMessage : Message = {
              sender = caller;
              content;
              createdAt = Time.now();
            };
            switch (Map.get(messages, nhash, conversationId)) {
              case (?msgs) {
                Map.set(messages, nhash, conversationId, Array.append(msgs, [newMessage]));
              };
              case (_) {
                Map.set(messages, nhash, conversationId, [newMessage]);
              };
            };
            // update the conversation
            let updatedReadBySeller = user.isSeller;
            let updatedReadByBuyer = not user.isSeller;

            Map.set(
              conversations,
              nhash,
              conversationId,
              {
                conversation with lastMessage = ?newMessage;
                readBySeller = updatedReadBySeller;
                readByBuyer = updatedReadByBuyer;
              },
            );
            return newMessage;
          };
          case (_) {
            Debug.trap("User not found");
          };
        };
      };
      case (_) {
        Debug.trap("Conversation not found");
      };
    };
  };

  public query func getMessages(conversationId : Nat) : async [Message] {
    switch (Map.get(messages, nhash, conversationId)) {
      case (?messages) {
        return messages;
      };
      case (_) {
        return [];
      };
    };
  };

  func conversationToDto(c : Conversation) : ConversationDto {
    switch (Map.get(users, phash, c.buyer)) {
      case (?buyerProfile) {
        switch (Map.get(users, phash, c.seller)) {
          case (?sellerProfile) {
            { c with buyerProfile; sellerProfile };
          };
          case (_) { Debug.trap("Seller not found") };
        };
      };
      case (_) { Debug.trap("Buyer not found") };
    };
  };

  public query func getConversationById(id : Nat) : async ConversationDto {
    switch (Map.get(conversations, nhash, id)) {
      case (?c) {
        return conversationToDto(c);
      };
      case (_) {
        Debug.trap("Conversation not found");
      };
    };
  };

  public query func getConversationByParticipants(buyer : Principal, seller : Principal) : async ?Conversation {
    return Array.find<Conversation>(
      Iter.toArray(Map.vals(conversations)),
      func(c) = c.buyer == buyer and c.seller == seller,
    );
  };

  public shared ({ caller }) func readConversation(conversationId : Nat) : async () {
    switch (Map.get(conversations, nhash, conversationId)) {
      case (?conversation) {
        switch (Map.get(users, phash, caller)) {
          case (?user) {
            if (user.isSeller) {
              Map.set(conversations, nhash, conversationId, { conversation with readBySeller = true });
            } else {
              Map.set(conversations, nhash, conversationId, { conversation with readByBuyer = true });
            };
          };
          case (_) {
            Debug.trap("User not found");
          };
        };
      };
      case (_) {
        Debug.trap("Conversation not found");
      };
    };
  };

  public shared ({ caller }) func createConversation(other : Principal) : async Conversation {
    switch (Map.get(users, phash, caller)) {
      case (?user) {
        let isSeller = user.isSeller;
        let newConversation : Conversation = {
          id = nextConversationId;
          buyer = if (isSeller) other else caller;
          seller = if (isSeller) caller else other;
          readBySeller = true;
          readByBuyer = true;
          lastMessage = null;
        };
        Map.set(conversations, nhash, newConversation.id, newConversation);
        nextConversationId += 1;
        return newConversation;
      };
      case (_) { Debug.trap("User not found") };
    };
  };

  public shared ({ caller }) func myConversations() : async [ConversationDto] {
    switch (Map.get(users, phash, caller)) {
      case (?user) {
        let chats = Iter.toArray(
          Iter.filter<Conversation>(
            Map.vals(conversations),
            func(c) = if (user.isSeller) c.seller == caller else c.buyer == caller,
          )
        );
        return Array.map<Conversation, ConversationDto>(
          chats,
          func(c) = conversationToDto(c),
        );
      };
      case (_) { Debug.trap("User not found") };
    };
  };

  public shared ({ caller }) func createProfile(profile : UserProfile) : async User {
    Map.set(users, phash, caller, { profile with id = caller });
    return { profile with id = caller };
  };

  public shared ({ caller }) func myProfile() : async ?User {
    return Map.get(users, phash, caller);
  };

  public query func getUser(id : Principal) : async User {
    switch (Map.get(users, phash, id)) {
      case (?user) {
        return user;
      };
      case (_) {
        Debug.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func createOrder(gigId : Nat) : async Order {
    switch (Map.get(gigs, nhash, gigId)) {
      case (?gig) {
        // check for sufficient balance
        let amount = gig.price * 100_000_000;

        let balance = await Icrc1Ledger.icrc1_balance_of({
          owner = caller;
          subaccount = null;
        });
        if (balance < amount + TRANSFER_FEE) {
          Debug.trap("Insufficient Balance");
        };
        // transfer escrow to the system
        let transfer_result = await Icrc1Ledger.icrc2_transfer_from({
          spender_subaccount = null;
          from = { owner = caller; subaccount = null };
          to = { owner = Principal.fromActor(this); subaccount = null };
          amount;
          fee = null;
          memo = null;
          created_at_time = null;
        });
        switch (transfer_result) {
          case (#Err(err)) {
            Debug.trap("Transfer failed");
          };
          case (#Ok(block_height)) {};
        };
        // create new order
        let newOrder : Order = {
          id = nextOrderId;
          gigId;
          title = gig.title;
          price = gig.price;
          buyer = caller;
          seller = gig.creator;
          status = #InProcess;
          createdAt = Time.now();
        };
        Map.set(orders, nhash, nextOrderId, newOrder);
        nextOrderId += 1;
        return newOrder;
      };
      case (_) {
        Debug.trap("Gig not found");
      };
    };
  };

  public shared ({ caller }) func myOrders() : async [OrderDto] {
    switch (Map.get(users, phash, caller)) {
      case (?user) {
        return Array.map<Order, OrderDto>(
          Iter.toArray(Iter.filter<Order>(Map.vals(orders), func(o) = if (user.isSeller) o.seller == caller else o.buyer == caller)),
          func(o) {
            switch (Map.get(users, phash, o.seller)) {
              case (?sellerProfile) {
                switch (Map.get(users, phash, o.buyer)) {
                  case (?buyerProfile) {
                    {
                      o with sellerName = sellerProfile.fullName;
                      buyerName = buyerProfile.fullName;
                    };
                  };
                  case (_) {
                    Debug.trap("Buyer not found");
                  };
                };
              };
              case (_) {
                Debug.trap("Seller not found");
              };
            };
          },
        );
      };
      case (_) {
        Debug.trap("User not found");
      };
    };

  };

  public shared ({ caller }) func createGig(payload : GigPayload) : async Gig {
    let newGig : Gig = {
      payload with
      id = nextGigId;
      creator = caller;
      totalStars = 0;
      starNumber = 0;
      sales = 0;
      createdAt = Time.now();
    };
    Map.set(gigs, nhash, nextGigId, newGig);
    nextGigId += 1;
    return newGig;
  };

  public func getGig(id : Nat) : async Gig {
    switch (Map.get(gigs, nhash, id)) {
      case (?gig) {
        return gig;
      };
      case (_) {
        Debug.trap("Gig not found");
      };
    };
  };

  public func deleteGig(id : Nat) : async Bool {
    switch (Map.get(gigs, nhash, id)) {
      case (?_) {
        Map.delete(gigs, nhash, id);
        true;
      };
      case (_) { false };
    };
  };

  public shared ({ caller }) func myGigs() : async [Gig] {
    Iter.toArray(Iter.filter<Gig>(Map.vals(gigs), func(g) = g.creator == caller));
  };

  public query func searchGigs({ category; minPrice; maxPrice } : SearchGigFilter) : async [Gig] {
    Iter.toArray(
      Iter.filter<Gig>(
        Map.vals(gigs),
        func(g) {
          var condition = true;

          switch (category) {
            case (?category) {
              condition := condition and g.cat == category;
            };
            case (_) {};
          };
          switch (minPrice) {
            case (?minPrice) {
              condition := condition and g.price >= minPrice;
            };
            case (_) {};
          };
          switch (maxPrice) {
            case (?maxPrice) {
              condition := condition and g.price <= maxPrice;
            };
            case (_) {};
          };
          return condition;
        },
      )
    );
  };
};
