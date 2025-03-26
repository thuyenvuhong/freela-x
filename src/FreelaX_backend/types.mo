import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Bool "mo:base/Bool";

module {
    public type GigPayload = {
        title : Text;
        desc : Text;
        cat : Text;
        price : Nat;
        cover : Blob;
        deliveryTime : Nat;
        revisionNumber : Nat;
        features : [Text];
    };

    public type Gig = {
        id : Nat;
        creator : Principal;
        totalStars : Nat;
        starNumber : Nat;
        sales : Nat;
        createdAt : Time.Time;
    } and GigPayload;

    public type SearchGigFilter = {
        category : ?Text;
        minPrice : ?Nat;
        maxPrice : ?Nat;
    };

    public type OrderStatus = {
        #InProcess;
        #Delivered;
        #Completed;
        #Canceled;
    };

    public type Order = {
        id : Nat;
        gigId : Nat;
        title : Text;
        price : Nat;
        seller : Principal;
        buyer : Principal;
        status : OrderStatus;
        createdAt : Time.Time;
    };

    public type OrderDto = Order and {
        sellerName : Text;
        buyerName : Text;
    };

    public type OrderDeliveryPayload = {
        orderId : Nat;
        message : Text;
        attachment : Blob;
    };

    public type OrderDelivery = OrderDeliveryPayload and {
        createdAt : Time.Time;
    };

    public type UserProfile = {
        fullName : Text;
        email : Text;
        img : Blob;
        country : Text;
        isSeller : Bool;
        desc : Text;
    };

    public type User = {
        id : Principal;
    } and UserProfile;

    public type Message = {
        sender : Principal;
        content : Text;
        createdAt : Time.Time;
    };

    public type Conversation = {
        id : Nat;
        buyer : Principal;
        seller : Principal;
        readBySeller : Bool;
        readByBuyer : Bool;
        lastMessage : ?Message;
    };

    public type ConversationDto = Conversation and {
        buyerProfile : UserProfile;
        sellerProfile : UserProfile;
    };

    public type ReviewPayload = {
        gigId : Nat;
        star : Nat;
        content : Text;
    };

    public type Review = ReviewPayload and {
        reviewer : Principal;
        createdAt : Time.Time;
    };

    public type ReviewDto = Review and {
        reviewerProfile : UserProfile;
    };
};
