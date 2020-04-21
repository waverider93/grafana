// Libraries
import React, { PureComponent } from 'react';

// Utils & Services
import { config } from 'app/core/config';

// Types
import { StatPanelOptions } from './types';
import {
  VizRepeater,
  VizRepeaterRenderValueProps,
  BigValue,
  DataLinksContextMenu,
  BigValueSparkline,
  BigValueGraphMode,
} from '@grafana/ui';

import {
  PanelProps,
  getFieldDisplayValues,
  FieldDisplay,
  ReducerID,
  getDisplayValueAlignmentFactors,
  DisplayValueAlignmentFactors,
} from '@grafana/data';

export class StatPanel extends PureComponent<PanelProps<StatPanelOptions>> {
  renderValue = (valueProps: VizRepeaterRenderValueProps<FieldDisplay, DisplayValueAlignmentFactors>): JSX.Element => {
    const { timeRange, options } = this.props;
    const { value, alignmentFactors, width, height } = valueProps;
    let sparkline: BigValueSparkline | undefined;

    if (value.sparkline) {
      sparkline = {
        data: value.sparkline,
        xMin: timeRange.from.valueOf(),
        xMax: timeRange.to.valueOf(),
        yMin: value.field.min,
        yMax: value.field.max,
      };

      const calc = options.reduceOptions.calcs[0];
      if (calc === ReducerID.last) {
        sparkline.highlightIndex = sparkline.data.length - 1;
      }
    }

    return (
      <DataLinksContextMenu links={value.getLinks}>
        {({ openMenu, targetClassName }) => {
          return (
            <BigValue
              value={value.display}
              sparkline={sparkline}
              colorMode={options.colorMode}
              graphMode={options.graphMode}
              justifyMode={options.justifyMode}
              alignmentFactors={alignmentFactors}
              width={width}
              height={height}
              theme={config.theme}
              onClick={openMenu}
              className={targetClassName}
            />
          );
        }}
      </DataLinksContextMenu>
    );
  };

  getValues = (): FieldDisplay[] => {
    const { data, options, replaceVariables, fieldConfig } = this.props;

    return getFieldDisplayValues({
      fieldConfig,
      reduceOptions: options.reduceOptions,
      replaceVariables,
      theme: config.theme,
      data: data.series,
      sparkline: options.graphMode !== BigValueGraphMode.None,
      autoMinMax: true,
    });
  };

  render() {
    const { height, options, width, data, renderCounter } = this.props;

    return (
      <VizRepeater
        getValues={this.getValues}
        getAlignmentFactors={getDisplayValueAlignmentFactors}
        renderValue={this.renderValue}
        width={width}
        height={height}
        source={data}
        itemSpacing={3}
        renderCounter={renderCounter}
        autoGrid={true}
        orientation={options.orientation}
      />
    );
  }
}
