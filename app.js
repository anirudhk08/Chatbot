var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page
app.get("/", function (req, res) {
  res.send("chatbot deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.CHATBOT_FB_VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event) {
          console.log("==========================================");
          console.log("EVENT: " +  JSON.stringify(event, null, 2));
          console.log("==========================================");
        }

        if (event.postback) {
          processPostback(event);
        }
        
        if (event.message && !event.message.is_echo && event.message.text) {
          processMessage(event);       
        }

      });
    });

    res.sendStatus(200);
  }
});

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  switch (payload) {
    case "Greeting":
      sendMessage(senderId, getIntroMsg());
      break;
    default:
      break;
  }
}

function processMessage(event) {
  var senderId = event.sender.id;
  var payload = "";

  if (event.message && event.message.quick_reply) {
    payload = event.message.quick_reply.payload;
  }

  switch (payload) {
    case "INTRO_YES":
      sendMessage(senderId, {text: "How's your day going?"});
      break;
    case "INTRO_NO":
      sendMessage(senderId, {text:  "Alright then may be next time.. Cya"});
      break;
    case "MOOD_GREAT":
      sendMessage(senderId, getGreatMoodMsg());
      break;
    case "MOOD_ANGRY":
      sendMessage(senderId, getAngryMoodMsg());
      break;
    case "MOOD_STRESS":
      sendMessage(senderId, getStressMoodMsg());
      break;
    case "MOOD_ANXIOUS":
      sendMessage(senderId, {text:  "Eek, I'm sorry my friend | sounds like its a difficult time"});
      break;
    case "MOOD_SAD":
      sendMessage(senderId, {text:  "Oh no, I'm sorry to hear that..."});
      break;
    case "MOOD_CALM":
      sendMessage(senderId, {text:  "Yay! Happy day!"});
      break;
    case "STRESS_GOOD":
      sendMessage(senderId, getGoodStressMsg());
      break;
    case "STRESS_BAD":
      sendMessage(senderId, getBadStressMsg());
    case "STRESS_HUH":
      sendMessage(senderId, {text:  "yeah, you know, some stress can be good for us | it can help us to perform"});
      break;
    case "GREAT_YEAH":
    case "ANGRY_I_GUESS":
    case "STRESS_GOOD_WOO":
    case "STRESS_BAD_YEAH":
      break;
    default:
      sendMessage(senderId, getMoodMsg());
      break;
  }  

}

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.CHATBOT_FB_PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}

// sends introduction message
function getIntroMsg() {
  var introMsg = {
    "text":"Got a second to check in?",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Yes",
        "payload":"INTRO_YES",
      },
      {
        "content_type":"text",
        "title":"No",
        "payload":"INTRO_NO",
      }
    ]
  }

  return introMsg;
}

// sends mood message
function getMoodMsg() {
  var moodMsg = {
    "text":"What's your mood like?",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"great",
        "payload":"MOOD_GREAT",
      },
      {
        "content_type":"text",
        "title":"stressed",
        "payload":"MOOD_STRESS",
      },
      {
        "content_type":"text",
        "title":"angry",
        "payload":"MOOD_ANGRY",
      },
      {
        "content_type":"text",
        "title":"anxious",
        "payload":"MOOD_ANXIOUS",
      },
      {
        "content_type":"text",
        "title":"sad",
        "payload":"MOOD_SAD",
      },
      {
        "content_type":"text",
        "title":"calm",
        "payload":"MOOD_CALM",
      }
    ]
  }

  return moodMsg;
}

// sends great mood message
function getGreatMoodMsg() {
  var greatMoodMsg = {
    "text":"Yay! Happy Days!",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Yeah",
        "payload":"GREAT_YEAH",
      }
    ]
  }

  return greatMoodMsg;
}


// sends angry mood message
function getAngryMoodMsg() {
  var angryMoodMsg = {
    "text":"Sometimes all you need is a distraction...",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"I guess",
        "payload":"ANGRY_I_GUESS",
      }
    ]
  }

  return angryMoodMsg;
}

// sends stress mood message
function getStressMoodMsg() {
  var stressMoodMsg = {
    "text":"Is this mostly good or mostly bad stress?",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"good",
        "payload":"STRESS_GOOD",
      },
      {
        "content_type":"text",
        "title":"bad",
        "payload":"STRESS_BAD",
      },
      {
        "content_type":"text",
        "title":"huh",
        "payload":"STRESS_HUH",
      }
    ]
  }

  return stressMoodMsg;
}

// sends good stress message
function getGoodStressMsg() {
  var stressMoodMsg = {
    "text":"Yay! Happy Days !",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"woo",
        "payload":"STRESS_GOOD_WOO"
      }
    ]
  }

  return stressMoodMsg;
}

// sends good stress message
function getBadStressMsg() {
  var stressMoodMsg = {
    "text":"Eek, I'm sorry my friend | sounds like a difficult time",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"yeah",
        "payload":"STRESS_BAD_YEAH"
      }
    ]
  }

  return stressMoodMsg;
}