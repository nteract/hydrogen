/* @flow */

import React from "react";
import { List as ImmutableList } from "immutable";
import { observer } from "mobx-react";
import { richestMimetype } from "@nteract/transforms";
import { Display } from "@nteract/display-area";

import { transforms, displayOrder } from "./transforms";
import Status from "./status";

import type { IObservableArray, IObservableValue } from "mobx";
import type { ImmutableOutput } from "@nteract/commutable/lib/types";

type Outputs = IObservableArray<ImmutableOutput>;

const isStatus = (outputs: Outputs, showStatus: boolean) => {
  return showStatus && outputs.length === 0;
};

const isSingeLine = (text: string) => {
  return (
    text.length < 50 &&
    (text.indexOf("\n") === text.length - 1 || text.indexOf("\n") === -1)
  );
};

const isPlain = (outputs: Outputs, multiline: boolean) => {
  if (multiline || outputs.length !== 1) return false;

  const output = outputs[0];
  switch (output.get("output_type")) {
    case "execute_result":
    case "display_data": {
      const bundle = output.get("data");
      const mimetype = richestMimetype(bundle, displayOrder, transforms);
      return mimetype === "text/plain"
        ? isSingeLine(bundle.get(mimetype))
        : false;
    }
    case "stream": {
      return isSingeLine(output.get("text"));
    }
    default: {
      return false;
    }
  }
};

type Props = {
  outputs: Outputs,
  status: IObservableValue<string>,
  showStatus: boolean,
  multiline: boolean
};

@observer class ResultViewComponent extends React.PureComponent {
  props: Props;
  static defaultProps = {
    showStatus: true,
    multiline: false
  };

  render() {
    const { outputs, status, showStatus, multiline } = this.props;

    if (isStatus(outputs, showStatus)) return <Status status={status} />;
    isPlain(outputs, multiline)
      ? console.log("Single Line output")
      : console.log("Multi Line output");
    return (
      <Display
        outputs={ImmutableList(outputs.peek())}
        displayOrder={displayOrder}
        transforms={transforms}
      />
    );
  }
}

export default ResultViewComponent;
