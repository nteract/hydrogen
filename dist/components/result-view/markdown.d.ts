import React from "react";
interface Props {
    data: string;
    mediaType: "text/markdown";
}
export declare class Markdown extends React.PureComponent<Props> {
    static defaultProps: {
        data: string;
        mediaType: string;
    };
    render(): JSX.Element;
}
export default Markdown;
