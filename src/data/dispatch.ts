import * as d3 from '../d3';

import { NeighborhoodGeoJSON } from './geojson';

export type Dispatch = d3.Dispatch<EventTarget>;
export const DispatchEvent = {
    Load: 'load',
    Select: 'select',
    Highlight: 'highlight',
    Filter: 'filter'
};

export interface LoadEventData {
    geo: NeighborhoodGeoJSON
}