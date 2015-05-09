var lastTimestamp = 0;
var pollRate = 1000;
var alertTimeoutId = null;
var focused = true;
var title = document.title;

window.onfocus = function () {
    if (alertTimeoutId != null) {
        clearInterval(alertTimeoutId);
        alertTimeoutId = null;
    }

    document.title = title;
    focused = true;
}

window.onblur = function() {
    focused = false;
}

function doNewMessageAlert() {
    var msg = "New Message";
    var timeoutId;
    var blink = function() { document.title = document.title == msg ? title : msg; };
    if (!alertTimeoutId && !focused) {
        alertTimeoutId = setInterval(blink, 1000);
    }
}

function updateChatTimes() {
    //run though all the chat messages in the DOM and
    //update the "posted X hrs/days/etc ago" labels
    $(".chat-body .post-date span").each(function(index, elem) {
        var date = moment($(elem).attr('data-date'), 'x');
        var posted = moment.duration(date.diff(moment())).humanize();

        $(elem).html(posted);
    });
}

function showProfileImage(image) {
    bootbox.alert("<img src='" + image + "' style='width: 100%'>", function() {
    });
}

function addToChatBox(messages) {
    var tzoff = new Date().getTimezoneOffset();

    for (var i = 0, len=messages.length; i < len; i++) {
        var msg = messages[i];

        var liClass = 'left';
        var spanClass = 'pull-left';
        var smallClass = 'pull-right';
        var strongClass = '';

        if (msg.userId == userid) {
            liClass = 'right';
            spanClass = 'pull-right';
            smallClass = '';
            strongClass = 'pull-right ';
        }

        var localTimePostedOn = moment(msg.timestamp).zone(tzoff);
        var posted = moment.duration(localTimePostedOn.diff(moment())).humanize();

        var pimage;

        if (msg.user.profileImage != null) {
            pimage = msg.user.profileImage.slice(0, -4) + "-t.jpg";
        } else {
            pimage = "/images/blank.png";
        }

        var id = msg.conversationId + msg.timestamp + msg.userId;

        $("ul.chat").append(
            '<li class="' + liClass + ' clearfix" id="' + id + '">' +
                '<span class="chat-img ' + spanClass + '">' +
                    '<a href="#">' +
                        '<img src="' + pimage +
                            '" alt="User Avatar" class="img-circle" style="width: 50px; height: 50px;" />' +
                    '</a>' +
                '</span>' +
                '<div class="chat-body clearfix">' +
                    '<div class="header">' +
                        '<strong class="' + strongClass + 'primary-font">' +
                            msg.user.username +
                        '</strong>' +
                        '<small class="' + smallClass + ' text-muted post-date">' +
                            '<i class="fa fa-clock-o fa-fw"></i><span data-date="' + localTimePostedOn + '">' + posted + '</span> ago' +
                        '</small>' +
                    '</div>' +
                    '<p>' +
                        html_sanitize(msg.message) +
                    '</p>' +
                '</div>' +
            '</li>'
        );

        (function (pimage) {
            $("#" + id + " > span > a").click(function (evt) {
                if (pimage != null) {
                    showProfileImage(pimage);
                }
                evt.preventDefault();
            });
        })(msg.user.profileImage);



        lastTimestamp = msg.timestamp;
    }

    if (messages.length > 0) {
        //something was added, scroll to the bottom
        document.getElementById('chat-body').scrollTop = 10000;
        //also alert
        doNewMessageAlert();
    }

}

function getChatSinceLastCheck() {
    var cid = conversationId;

    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/chat/since/" + cid + "/" + lastTimestamp +"?timestamp="+$.now(),
        contentType: "application/json",
        success:
        function(data) {
            addToChatBox(data);
        }
    });
}

function sendChat() {
    var text = $("#btn-input").val();
    $("#btn-input").val('');
    var cid = conversationId;

    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/chat/add",
        contentType: "application/json",
        data: JSON.stringify({"chatText": text, "conversationId": cid}),
        success:
        function(data) {
        }
    });
}

function chatRefresh() {
    getChatSinceLastCheck();
    updateChatTimes();
}

function chatTimer() {
    chatRefresh();
    setTimeout(chatTimer, pollRate);
}

function leaveChat() {
    var cid = conversationId;

    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/chat/leave",
        contentType: "application/json",
        data: JSON.stringify({"conversationId": cid}),
        success:
        function(data) {
            window.location = "/";
        }
    });
}

$(document).ready(function() {
    var cid = conversationId;

    //grab the most recent chat messages
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/chat/recent/" + cid,
        contentType: "application/json",
        success:
        function(data) {
            addToChatBox(data);
        }
    });

    $("#btn-chat").click(function(evt) {
        sendChat();
    });

    $("#btn-input").keypress(function (e) {
        var key = e.which;
        if(key == 13)  { //enter key
            sendChat();
            return false;
        }
    });

    $("#chat-refresh").click(function (e) {
        chatRefresh();
        e.preventDefault();
    });

    $("#chat-leave").click(function (e) {
        leaveChat();
        e.preventDefault();
    });

    setTimeout(chatTimer, pollRate);
});
