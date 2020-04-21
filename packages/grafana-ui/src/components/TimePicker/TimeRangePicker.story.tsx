import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { TimeRangePicker } from './TimeRangePicker';
import { UseState } from '../../utils/storybook/UseState';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { TimeFragment, dateTime } from '@grafana/data';

const TimeRangePickerStories = storiesOf('General/TimeRangePicker', module);

TimeRangePickerStories.addDecorator(withCenteredStory);

TimeRangePickerStories.add('default', () => {
  return (
    <UseState
      initialState={{
        from: dateTime(),
        to: dateTime(),
        raw: { from: 'now-6h' as TimeFragment, to: 'now' as TimeFragment },
      }}
    >
      {(value, updateValue) => {
        return (
          <TimeRangePicker
            timeZone="browser"
            value={value}
            onChange={timeRange => {
              action('onChange fired')(timeRange);
              updateValue(timeRange);
            }}
            onMoveBackward={() => {
              action('onMoveBackward fired')();
            }}
            onMoveForward={() => {
              action('onMoveForward fired')();
            }}
            onZoom={() => {
              action('onZoom fired')();
            }}
          />
        );
      }}
    </UseState>
  );
});
