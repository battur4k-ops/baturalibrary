export const EVENTS = {
    CONTENT_READY: 'batura:contentReady',
    OPEN_LAB: 'batura:openLab',
    LAB_OPENED: 'batura:labOpened',
    LAB_CLOSED: 'batura:labClosed',
    FILTER_CHANGED: 'batura:filterChanged',
    SEARCH: 'batura:search'
};

export const dispatch = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
};

export const on = (name, handler, options) => {
    window.addEventListener(name, handler, options);
};
