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
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Load), this.onLoad.bind(this));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Select), this.onSelect.bind(this));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Highlight), this.onHighlight.bind(this));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Filter), this.onFilter.bind(this));

        // Set up empty events
        this.selection = { neighborhoods: undefined, listings: undefined };
        this.highlight = { neighborhood: undefined, listing: undefined };
        this.filter = { filter: false };
    }

    private eventBind(handler: Function) {
        return function() {
            // 'this' 
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