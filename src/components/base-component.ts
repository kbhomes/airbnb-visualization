import * as d3 from '../d3';
import * as dispatch from '../data/dispatch';

export abstract class BaseComponent {
    protected element: Element;
    protected selector: string;
    protected dispatcher: dispatch.Dispatch;

    protected data: dispatch.LoadEventData;
    protected selection: dispatch.SelectEventData;
    protected highlight: dispatch.HighlightEventData;
    protected filter: dispatch.FilterEventData;

    public constructor(selector: string, dispatcher: dispatch.Dispatch) {
        this.element = document.querySelector(selector);
        this.selector = selector;
        this.dispatcher = dispatcher;

        // Set up dispatch listeners
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Load), this.eventBind(this.onLoad));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Select), this.eventBind(this.onSelect));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Highlight), this.eventBind(this.onHighlight));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Filter), this.eventBind(this.onFilter));

        // Set up empty events
        this.selection = { neighborhoods: undefined, listings: undefined };
        this.highlight = { neighborhood: undefined, listing: undefined };
        this.filter = { filter: false };
    }

    private eventBind(handler: Function) {
        let self = this;

        return function(args: any) {
            // In this function, 'this' is the sender of the dispatch call
            // Only forward the call if the sender is a different component
            if (self !== this) {
                handler.call(self, args);
            }
        }
    }

    private getComponentName(): string {
        return this.constructor['name'];
    }

    private getComponentEventName(event: string) : string {
        return event + '.' + this.getComponentName();
    }

    public onLoad(data: dispatch.LoadEventData) : void {
        this.data = data;
    }

    public onSelect(selection: dispatch.SelectEventData) : void {
        this.selection = selection;
    }

    public onHighlight(highlight: dispatch.HighlightEventData) : void {
        this.highlight = highlight;
    }
    
    public onFilter(filter: dispatch.FilterEventData) : void {
        this.filter = filter;
    }

    public abstract resize();
    public abstract render();
}