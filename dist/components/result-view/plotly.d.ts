import * as React from "react";
interface Props {
    data: string | Record<string, any>;
    mediaType: "application/vnd.plotly.v1+json";
}
declare type ObjectType = Record<string, any>;
interface FigureLayout extends ObjectType {
    height?: string;
    autosize?: boolean;
}
interface Figure extends ObjectType {
    data: Record<string, any>;
    layout: FigureLayout;
}
declare class PlotlyHTMLElement extends HTMLDivElement {
    data: Record<string, any>;
    layout: Record<string, any>;
    newPlot: () => void;
    redraw: () => void;
}
export declare class PlotlyTransform extends React.Component<Props> {
    static defaultProps: {
        data: string;
        mediaType: string;
    };
    plotDiv: HTMLDivElement | null;
    Plotly: {
        newPlot: (div: HTMLDivElement | null | void, data: Record<string, any>, layout: FigureLayout) => void;
        redraw: (div?: PlotlyHTMLElement) => void;
        toImage: (gd: any) => Promise<string>;
    };
    constructor(props: Props);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: Props): boolean;
    componentDidUpdate(): void;
    plotDivRef: (plotDiv: HTMLDivElement | null) => void;
    getFigure: () => Figure;
    downloadImage: (gd: any) => void;
    render(): JSX.Element;
}
export default PlotlyTransform;
