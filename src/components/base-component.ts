import * as d3 from '../d3';
import { Dispatch, DispatchEvent, LoadEventData } from '../data/dispatch';

export abstract class BaseComponent {
    protected element: Element;
    protected selector: string;
    protected dispatcher: Dispatch;

    public constructor(selector: string, dispatcher: Dispatch) {
        this.element = document.querySelector(selector);
        this.selector = selector;
        this.dispatcher = dispatcher;

        // Set up dispatch listeners
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Load), this.onLoad.bind(this));
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Select), this.onSelect.bind(this));
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Highlight), this.onHighlight.bind(this));
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Filter), this.onFilter.bind(this));
    }

    private getComponentName(): string {
        return this.constructor['name'];
    }

    private getComponentEventName(event: string) {
        return event + '.' + this.getComponentName();
    }

    public abstract onLoad(data: LoadEventData);
    public abstract onSelect();
    public abstract onHighlight();
    public abstract onFilter();
    public abstract resize();
    public abstract render();

}