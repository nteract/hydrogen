/* @flow */

/**
 * Adapted from https://github.com/nteract/nteract/blob/master/packages/outputs/src/components/media/markdown.tsx
 * Copyright (c) 2016 - present, nteract contributors
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @NOTE: This `Markdown` component could be used exactly same as the original `Media.Markdown` component of @nteract/outputs,
 *        except that this file adds a class name to it for further stylings in styles/hydrogen.less.
 */

import MarkdownComponent from "@nteract/markdown";
import React from "react";

interface Props {
  /**
   * Markdown text.
   */
  data: string;
  /**
   * Media type. Defaults to `text/markdown`.
   * For more on media types, see: https://www.w3.org/TR/CSS21/media.html%23media-types.
   */
  mediaType: "text/markdown";
}

export class Markdown extends React.PureComponent<Props> {
  static defaultProps = {
    data: "",
    mediaType: "text/markdown"
  };

  render() {
    return (
      <div className="markdown">
        <MarkdownComponent source={this.props.data} />
      </div>
    );
  }
}

export default Markdown;
