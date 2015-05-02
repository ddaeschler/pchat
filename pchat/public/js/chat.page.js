var lastChatId = 0;

function updateChatTimes() {
    //run though all the chat messages in the DOM and
    //update the "posted X hrs/days/etc ago" labels
    $(".chat-body .post-date span").each(function(index, elem) {
        var date = moment($(elem).attr('data-date'), 'x');
        var posted = moment.duration(date.diff(moment())).humanize();

        $(elem).html(posted);
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

        var localTimePostedOn = moment(msg.postedOn).zone(tzoff);
        var posted = moment.duration(localTimePostedOn.diff(moment())).humanize();

        $("ul.chat").append(
            '<li class="' + liClass + ' clearfix">' +
                '<span class="chat-img ' + spanClass + '">' +
                    '<img src="http://profileimg.inworldz.com/profileimg/?uid=' + msg.userId +
                        '&type=image" alt="User Avatar" class="img-circle" style="width: 50px; height: 50px;" onerror="imgError(this);" />' +
                '</span>' +
                '<div class="chat-body clearfix">' +
                    '<div class="header">' +
                        '<strong class="' + strongClass + 'primary-font">' +
                            msg.user.firstName + ' ' + msg.user.lastName +
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

        lastChatId = msg.id;
    }

    if (messages.length > 0) {
        //something was added, scroll to the bottom
        document.getElementById('chat-body').scrollTop = 10000;
    }

}

function getChatSinceLastCheck() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/chat/since/" + lastChatId,
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

    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/chat/add",
        contentType: "application/json",
        data: JSON.stringify({"chatText": text}),
        success:
        function(data) {
            getChatSinceLastCheck();
        }
    });
}

function chatRefresh() {
    getChatSinceLastCheck();
    updateChatTimes();
}

function chatTimer() {
    chatRefresh();
    setTimeout(chatTimer, 10000);
}

$(document).ready(function() {
    //grab the most recent chat messages
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/chat/recent",
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

    setTimeout(chatTimer, 10000);
});