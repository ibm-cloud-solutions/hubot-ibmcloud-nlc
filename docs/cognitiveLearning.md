# Cognitive learning

We provide a mechanism to collect feedback from the user's natural language interactions with the bot.  Then the collected data can be analyzed with our UI to improve the quality of your training data corpus.


#### Medium Confidence
When the Natural Language Classifier reports a medium level confidence, we prompt the user with the top results. The user responses are collected to help determining the user's real intent.

#### Low Confidence
When the Natural Language Classifier reports a low confidence, we collect information about the unmatched statement.

#### Negative feedback
We detect when the user says negative statements, such as "That's not what I meant", then save the mishandled statement for review.


## Configuration

```
CONFIDENCE_THRESHOLD_HIGH
CONFIDENCE_THRESHOLD_LOW
```


```
HUBOT_CLOUDANT_ENDPOINT=
HUBOT_CLOUDANT_KEY=
HUBOT_CLOUDANT_PASSWORD=
HUBOT_CLOUDANT_DB=nlc
```
