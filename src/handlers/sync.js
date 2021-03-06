import config from '../config';

const INTERVAL = config.FLUSH_INTERVAL;

var state = {
    user: null,
    timeline: null,
    position: 1,
    events: []
};

function handleUser (type, e) {
    state.user = e;
}

function handlePost (type, e) {
    var post = Object.assign({
        impressionOrder: state.position++,
        visibility: type,
        visibilityInfo: e.visibilityInfo,
        type: 'impression',
        timelineId: state.timeline.id
    }, e.data);

    if (post.visibility === 'public') {
        post.html = e.element.html();
    }
    state.events.push(post);
}

function handleTimeline (type, e) {
    state.position = 1;
    state.timeline = {
        type: 'timeline',
        id: e.uuid,
        startTime: e.startTime,
        location: window.location.href
    };
    state.events.push(state.timeline);
}

function sync (hub) {
    if (state.events.length) {
        // Send timelines to the page handling the communication with the API.
        // This might be refactored using something compatible to the HUB architecture.
        chrome.runtime.sendMessage({ type: 'sync', payload: state.events, userId: state.user.id },
                                   (response) => hub.event('syncResponse', response));

        state.events = [];
    }
}

export function register (hub) {
    hub.register('user', handleUser);
    hub.register('newPost', handlePost);
    hub.register('newTimeline', handleTimeline);
    hub.register('windowUnload', sync.bind(null, hub));
    window.setInterval(sync.bind(null, hub), INTERVAL);
}
