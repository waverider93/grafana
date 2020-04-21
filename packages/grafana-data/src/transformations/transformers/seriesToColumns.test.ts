import {
  ArrayVector,
  DataTransformerConfig,
  DataTransformerID,
  Field,
  FieldType,
  toDataFrame,
  transformDataFrame,
} from '@grafana/data';
import { SeriesToColumnsOptions, seriesToColumnsTransformer } from './seriesToColumns';
import { mockTransformationsRegistry } from '../../utils/tests/mockTransformationsRegistry';

describe('SeriesToColumns Transformer', () => {
  beforeAll(() => {
    mockTransformationsRegistry([seriesToColumnsTransformer]);
  });
  const everySecondSeries = toDataFrame({
    name: 'even',
    fields: [
      { name: 'time', type: FieldType.time, values: [3000, 4000, 5000, 6000] },
      { name: 'temperature', type: FieldType.number, values: [10.3, 10.4, 10.5, 10.6] },
      { name: 'humidity', type: FieldType.number, values: [10000.3, 10000.4, 10000.5, 10000.6] },
    ],
  });

  const everyOtherSecondSeries = toDataFrame({
    name: 'odd',
    fields: [
      { name: 'time', type: FieldType.time, values: [1000, 3000, 5000, 7000] },
      { name: 'temperature', type: FieldType.number, values: [11.1, 11.3, 11.5, 11.7] },
      { name: 'humidity', type: FieldType.number, values: [11000.1, 11000.3, 11000.5, 11000.7] },
    ],
  });

  it('joins by time field', () => {
    const cfg: DataTransformerConfig<SeriesToColumnsOptions> = {
      id: DataTransformerID.seriesToColumns,
      options: {
        byField: 'time',
      },
    };

    const filtered = transformDataFrame([cfg], [everySecondSeries, everyOtherSecondSeries])[0];
    expect(filtered.fields).toEqual([
      {
        name: 'time',
        type: FieldType.time,
        values: new ArrayVector([1000, 3000, 4000, 5000, 6000, 7000]),
        config: {},
        labels: { origin: 'even,odd' },
      },
      {
        name: 'temperature {even}',
        type: FieldType.number,
        values: new ArrayVector([null, 10.3, 10.4, 10.5, 10.6, null]),
        config: {},
        labels: { origin: 'even' },
      },
      {
        name: 'humidity {even}',
        type: FieldType.number,
        values: new ArrayVector([null, 10000.3, 10000.4, 10000.5, 10000.6, null]),
        config: {},
        labels: { origin: 'even' },
      },
      {
        name: 'temperature {odd}',
        type: FieldType.number,
        values: new ArrayVector([11.1, 11.3, null, 11.5, null, 11.7]),
        config: {},
        labels: { origin: 'odd' },
      },
      {
        name: 'humidity {odd}',
        type: FieldType.number,
        values: new ArrayVector([11000.1, 11000.3, null, 11000.5, null, 11000.7]),
        config: {},
        labels: { origin: 'odd' },
      },
    ]);
  });

  it('joins by temperature field', () => {
    const cfg: DataTransformerConfig<SeriesToColumnsOptions> = {
      id: DataTransformerID.seriesToColumns,
      options: {
        byField: 'temperature',
      },
    };

    const filtered = transformDataFrame([cfg], [everySecondSeries, everyOtherSecondSeries])[0];
    expect(filtered.fields).toEqual([
      {
        name: 'temperature',
        type: FieldType.number,
        values: new ArrayVector([10.3, 10.4, 10.5, 10.6, 11.1, 11.3, 11.5, 11.7]),
        config: {},
        labels: { origin: 'even,odd' },
      },
      {
        name: 'time {even}',
        type: FieldType.time,
        values: new ArrayVector([3000, 4000, 5000, 6000, null, null, null, null]),
        config: {},
        labels: { origin: 'even' },
      },
      {
        name: 'humidity {even}',
        type: FieldType.number,
        values: new ArrayVector([10000.3, 10000.4, 10000.5, 10000.6, null, null, null, null]),
        config: {},
        labels: { origin: 'even' },
      },
      {
        name: 'time {odd}',
        type: FieldType.time,
        values: new ArrayVector([null, null, null, null, 1000, 3000, 5000, 7000]),
        config: {},
        labels: { origin: 'odd' },
      },
      {
        name: 'humidity {odd}',
        type: FieldType.number,
        values: new ArrayVector([null, null, null, null, 11000.1, 11000.3, 11000.5, 11000.7]),
        config: {},
        labels: { origin: 'odd' },
      },
    ]);
  });

  it('joins by time field in reverse order', () => {
    const cfg: DataTransformerConfig<SeriesToColumnsOptions> = {
      id: DataTransformerID.seriesToColumns,
      options: {
        byField: 'time',
      },
    };

    everySecondSeries.fields[0].values = new ArrayVector(everySecondSeries.fields[0].values.toArray().reverse());
    everySecondSeries.fields[1].values = new ArrayVector(everySecondSeries.fields[1].values.toArray().reverse());
    everySecondSeries.fields[2].values = new ArrayVector(everySecondSeries.fields[2].values.toArray().reverse());

    const filtered = transformDataFrame([cfg], [everySecondSeries, everyOtherSecondSeries])[0];
    expect(filtered.fields).toEqual([
      {
        name: 'time',
        type: FieldType.time,
        values: new ArrayVector([1000, 3000, 4000, 5000, 6000, 7000]),
        config: {},
        labels: { origin: 'even,odd' },
      },
      {
        name: 'temperature {even}',
        type: FieldType.number,
        values: new ArrayVector([null, 10.3, 10.4, 10.5, 10.6, null]),
        config: {},
        labels: { origin: 'even' },
      },
      {
        name: 'humidity {even}',
        type: FieldType.number,
        values: new ArrayVector([null, 10000.3, 10000.4, 10000.5, 10000.6, null]),
        config: {},
        labels: { origin: 'even' },
      },
      {
        name: 'temperature {odd}',
        type: FieldType.number,
        values: new ArrayVector([11.1, 11.3, null, 11.5, null, 11.7]),
        config: {},
        labels: { origin: 'odd' },
      },
      {
        name: 'humidity {odd}',
        type: FieldType.number,
        values: new ArrayVector([11000.1, 11000.3, null, 11000.5, null, 11000.7]),
        config: {},
        labels: { origin: 'odd' },
      },
    ]);
  });

  describe('Field names', () => {
    const seriesWithSameFieldAndDataFrameName = toDataFrame({
      name: 'temperature',
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000, 3000, 4000] },
        { name: 'temperature', type: FieldType.number, values: [1, 3, 5, 7] },
      ],
    });

    const seriesB = toDataFrame({
      name: 'B',
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000, 3000, 4000] },
        { name: 'temperature', type: FieldType.number, values: [2, 4, 6, 8] },
      ],
    });

    it('when dataframe and field share the same name then use the field name', () => {
      const cfg: DataTransformerConfig<SeriesToColumnsOptions> = {
        id: DataTransformerID.seriesToColumns,
        options: {
          byField: 'time',
        },
      };

      const filtered = transformDataFrame([cfg], [seriesWithSameFieldAndDataFrameName, seriesB])[0];
      const expected: Field[] = [
        {
          name: 'time',
          type: FieldType.time,
          values: new ArrayVector([1000, 2000, 3000, 4000]),
          config: {},
          labels: { origin: 'temperature,B' },
        },
        {
          name: 'temperature',
          type: FieldType.number,
          values: new ArrayVector([1, 3, 5, 7]),
          config: {},
          labels: { origin: 'temperature' },
        },
        {
          name: 'temperature {B}',
          type: FieldType.number,
          values: new ArrayVector([2, 4, 6, 8]),
          config: {},
          labels: { origin: 'B' },
        },
      ];

      expect(filtered.fields).toEqual(expected);
    });
  });
});
