import Graph from './graph.js';

var graphsActive = [];
var graphPlusEvents = new Map();
var graphStages = new Map();
var timelines = new Map();

function returnEndTime(time) {
  var t = new Date(time);
  return t.setSeconds(t.getSeconds() + 5);
}

var Controller = class Controller {

  createEvent(data, id, stage, end){
    var eventObject = new Object();
    eventObject.type = data['type'];
    eventObject.ts = ((data['data'])['ts']);
    eventObject.stage = stage;
    eventObject.end = end;

    return eventObject;
  }

  manageStages(data, stage, graph) {
    if (data['type'] === 'model.StageCompletedEvent') {
      var events = graph.allEvents;
      for (var i=0; i<events.length; i++) {
        var eventObject = events[i];
        if (eventObject['stage'] === stage){
          eventObject['end'] = ((data['data'])['ts']);
        }
      }
      graph.createDataSet();
    }
  }

  manageEvents(data) {
    let id = null;
    let stage = null;
    let end = returnEndTime(((data['data'])['ts']));

    switch (data['type']) {
      case 'model.GraphCreatedEvent':
        id = (data['data'])['graphId'];
        this.graphActivated(id);
        graphPlusEvents.set(id, []);
        break;
      case 'model.GraphCompletedEvent':
        id = (data['data'])['graphId'];
        this.graphTerminated(id);
        break;
      case 'model.GraphCommittedEvent':
        id = (data['data'])['graphId'];
      default:
        id = data['sub'];
        stage = (data['data'])['stageId'];
        end = null;
        break;
    }
    var eventObject = this.createEvent(data, id, stage, end);
    graphPlusEvents.get(id).push(eventObject);

    var graph = new Graph(id, graphPlusEvents.get(id));
    graph.createDataSet();

    this.manageStages(data, stage, graph);

    var index = graphsActive.indexOf(id);
    timelines.set(index, graph);
  }

  graphActivated(subId){
    if(graphsActive.indexOf(subId) === -1){
      graphsActive.push(subId);
    }
  }

  graphTerminated(subId){
    var index = graphsActive.indexOf(subId);
    if (index > -1) {
      graphsActive.splice(index, 1);
    }
  }

  getActiveGraphs() {
    return graphsActive;
  }

  getGraphsWithEvents() {
    return graphPlusEvents;
  }

  getTimelines() {
    return timelines;
  }
}

export default Controller;
