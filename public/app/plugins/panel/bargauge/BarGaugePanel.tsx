// Libraries
import React, { PureComponent } from 'react';

// Services & Utils
import { config } from 'app/core/config';

import { BarGauge, VizRepeater, VizRepeaterRenderValueProps, DataLinksContextMenu } from '@grafana/ui';
import { BarGaugeOptions } from './types';
import {
  getFieldDisplayValues,
  FieldDisplay,
  PanelProps,
  getDisplayValueAlignmentFactors,
  DisplayValueAlignmentFactors,
} from '@grafana/data';

export class BarGaugePanel extends PureComponent<PanelProps<BarGaugeOptions>> {
  renderValue = (valueProps: VizRepeaterRenderValueProps<FieldDisplay, DisplayValueAlignmentFactors>): JSX.Element => {
    const { options } = this.props;
    const { value, alignmentFactors, orientation, width, height } = valueProps;
    const { field, display, view, colIndex } = value;

    return (
      <DataLinksContextMenu links={value.getLinks}>
        {({ openMenu, targetClassName }) => {
          return (
            <BarGauge
              value={display}
              width={width}
              height={height}
              orientation={orientation}
              field={field}
              display={view?.getFieldDisplayProcessor(colIndex)}
              theme={config.theme}
              itemSpacing={this.getItemSpacing()}
              displayMode={options.displayMode}
              onClick={openMenu}
              className={targetClassName}
              alignmentFactors={alignmentFactors}
              showUnfilled={options.showUnfilled}
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
      autoMinMax: true,
    });
  };

  getItemSpacing(): number {
    if (this.props.options.displayMode === 'lcd') {
      return 2;
    }

    return 10;
  }

  render() {
    const { height, width, options, data, renderCounter } = this.props;

    return (
      <VizRepeater
        source={data}
        getAlignmentFactors={getDisplayValueAlignmentFactors}
        getValues={this.getValues}
        renderValue={this.renderValue}
        renderCounter={renderCounter}
        width={width}
        height={height}
        itemSpacing={this.getItemSpacing()}
        orientation={options.orientation}
      />
    );
  }
}
