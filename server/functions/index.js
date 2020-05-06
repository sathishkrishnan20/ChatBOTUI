const functions = require('firebase-functions');
const cors = require('cors')({ origin: true});
var admin = require("firebase-admin");

var serviceAccount = require('./mysecondbot-firebase.json');
const { SessionsClient } = require('dialogflow');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
 // databaseURL: "https://mysecondbot-hoypru.firebaseio.com"
});

const institutes = [
    {
        branchCity: 'chennai',
        availableSteams: [ 'MECH', 'CSE', 'ECE', 'EEE' ],
        availableCoures: {
            'CSE' : ['JAVA', 'C', 'C++', 'Node.JS'],
            'MECH': ['ThermoDynamics', 'Mechanics'],
            'ECE' : ['Elecronics', 'Communications'],
            'ECE' : ['Electro Magnetics', 'Electorns']
        }
    },
    {
        branchCity: 'bengaluru',
        availableSteams: [ 'MECH', 'CSE' ],
        availableCoures: {
            'CSE' : ['JAVA', 'C', 'C++', 'Node.JS'],
            'MECH': ['ThermoDynamics', 'Mechanics']
        }
    },
    {
        branchCity: 'mumbai',
        availableSteams: [ 'MECH', 'CSE' ],
        availableCoures: {
            'CSE' : ['JAVA', 'C', 'Node.JS'],
            'MECH': ['ThermoDynamics', 'Mechanics'],
            'ECE' : ['Elecronics', 'Communications'],
            'ECE' : ['Electro Magnetics' ]
        }
    }
]

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.dialogflowGateway = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
    const { queryInput, sessionId } = request.body;
  
    const sessionClient = new SessionsClient({ credentials: serviceAccount });
    
    const session = sessionClient.sessionPath('cskinstitute-tfhlsc', sessionId);
        
  
      const responses = await sessionClient.detectIntent({ session, queryInput});
      const result = responses[0].queryResult;
  
      response.send(result);
    });
  });

const { WebhookClient } = require('dialogflow-fulfillment');

exports.dialogflowWebhook = functions.https.onRequest(async (request, response) => {
    const agent = new WebhookClient({ request, response });

    console.log(JSON.stringify(request.body));

    const result = request.body.queryResult;
    
    function welcome(agent) {
      agent.add(`Welcome to my agent!`);
    }
   
    function fallback(agent) {
      agent.add(`Sorry, can you try again?`);
    }

    function getMajorCities(agent) {
        const branchCities = [
            '1. Chennai',
            '2. Bengaluru',
            '3. Mumbai'
         ]
        agent.add('Thank you for your Interest in our Intitute. We have Three branches in three major Cities: ' + branchCities.toString())
    }
    function getAvailableStreamsOfTheCity(agent) {
        console.log(agent);
        
            const { parameters } = request.body.queryResult;
            const geoCity = String(parameters['geo-city']);
            console.log(geoCity);
            const branchInfo = institutes.find(ele => {
                return ele.branchCity === geoCity.toLowerCase()
            });
            if(branchInfo === undefined) {
                agent.add('Sorry, You have Choosen ' + geoCity + ' but don\'t have branch yet on ' + geoCity);
            } else {
                agent.add(
                    'Thank you For your Response we have ' +
                    branchInfo.availableSteams.length  +   ' below Streams Available on ' + 
                    geoCity + ' ' + 
                    branchInfo.availableSteams.map((ele, index) => String(index + 1) + '. ' + String(ele)).join(' ')
                );
            }
    }
   
    function getAvailableCoursesOfTheStream(agent) {
        console.log(agent);
        console.log(request.body.queryResult);
        const { parameters } = request.body.queryResult;
        console.log(parameters);
        const geoCity = String(parameters['geo-city']);
        const branchInfo = institutes.find(ele => {
            return ele.branchCity === geoCity.toLowerCase()
        });
        const choosenStream = parameters.streams;
        
        const availableCoursesOnStream = branchInfo.availableCoures[choosenStream];
        if(availableCoursesOnStream === undefined) {
            agent.add('You have Choosen Wrong Strean, can you say again?');
        } else {
            agent.add('Thank you For your Response, We are Proving ' + availableCoursesOnStream.join(', ') + ' Courses Under ' + choosenStream + ' On ' + geoCity + '. Please Contact our Management for Joining Formalities');
        }
    }
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('gettingTheNameAndAskingLookingForNewJoin - yes', getMajorCities);
    intentMap.set('choosenYesChooseCityOftheBranch', getAvailableStreamsOfTheCity);
    intentMap.set('choosenYesChooseCityOftheBranchChooseStream', getAvailableCoursesOfTheStream)
    
    agent.handleRequest(intentMap);
});
