import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ApexOptions } from "apexcharts";
import { FunctionComponent, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

interface RealtimeTemperatureChartProps {
    series: ApexAxisChartSeries
}

type TimeFrame = '1 minute' | '1 hour' | '1 day'

const RealtimeTemperatureChart: FunctionComponent<RealtimeTemperatureChartProps> = ({ series }) => {

    const getMinimumYAxisValue = (series: ApexAxisChartSeries): number => Math.min(...(series[0].data as { x: any; y: any }[]).map(point => point.y as number));
    const getMaximumYAxisValue = (series: ApexAxisChartSeries): number => Math.max(...(series[0].data as { x: any; y: any }[]).map(point => point.y as number));

    const defaultOptions: ApexOptions = {
        chart: {
            type: 'line',
            animations: {
                enabled: true,
                easing: "easeinout",
                dynamicAnimation: {
                    speed: 1000
                }
            },
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            colors: ['#000']
        },
        title: {
            text: 'Temperatures over the last hour',
            align: 'left'
        },
        markers: {
            size: 0
        },
        xaxis: {
            type: 'datetime',
            min: new Date().getTime() - 3600000,
            labels: {
                format: 'HH:mm'
            }
        },
        yaxis: {
            min: getMinimumYAxisValue(series),
            max: getMinimumYAxisValue(series),
            labels: {
                formatter: (val: number) => val.toFixed(0)
            }
        },
        legend: {
            show: false
        },
    };

    const [options, setOptions] = useState<ApexOptions>(defaultOptions);
    const [timeframe, setTimeFrame] = useState<TimeFrame>('1 hour');

    const handleTimeFrameChange = (_: React.MouseEvent<HTMLElement>, timeframe: TimeFrame,) => {
        let timeAgoInMilliSeconds: number;

        switch (timeframe) {
            case '1 day':
                timeAgoInMilliSeconds = 86400000
                break;
            case '1 hour':
                timeAgoInMilliSeconds = 3600000;
                break;
            case '1 minute':
                timeAgoInMilliSeconds = 60000;
                break;
        }

        setTimeFrame(timeframe);
        setOptions(o => ({
            ...o, xaxis:
            {
                ...o.xaxis,
                min: new Date().getTime() - timeAgoInMilliSeconds,
                labels: {
                    format: timeframe == '1 minute' ? 'HH:mm:ss' : 'HH:mm'
                }
            }
        }));
    }

    // Adjust YAxis based on data
    useEffect(() => {
        const yAxisBufferInDegress = 3;
        const minYAxisValue = getMinimumYAxisValue(series) - yAxisBufferInDegress;
        const maxYAxisValue = getMaximumYAxisValue(series) + yAxisBufferInDegress;

        const yAxisOptions = options?.yaxis as ApexYAxis;
        if ((yAxisOptions?.min ?? 0) >= minYAxisValue || (yAxisOptions?.max ?? 30) <= maxYAxisValue) {
            setOptions(o => ({
                ...o, yaxis:
                {
                    ...o.yaxis,
                    min: minYAxisValue,
                    max: maxYAxisValue
                }
            }));
        }
    }, [series])

    return (
        <>

            <ReactApexChart options={options} series={series} type="line" height={'85%'} width={'95%'} />
            <ToggleButtonGroup
                value={timeframe ?? '1 hour'}
                exclusive
                onChange={handleTimeFrameChange}
                aria-label="Timeframe selection"
                sx={{ alignItems: 'center', marginLeft: '2em' }}
            >
                <ToggleButton value="1 minute" aria-label="1 minute" children="1 Minute" />
                <ToggleButton value="1 hour" aria-label="1 hour" children="1 Hour" />
                <ToggleButton value="1 day" aria-label="1 day" children="1 Day" />
            </ToggleButtonGroup>
        </>
    )
};

export default RealtimeTemperatureChart;