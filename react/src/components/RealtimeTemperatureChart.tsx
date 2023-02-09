import { ApexOptions } from "apexcharts";
import { FunctionComponent } from "react";
import ReactApexChart from "react-apexcharts";

interface RealtimeTemperatureChartProps {
    series: ApexAxisChartSeries
}

const RealtimeTemperatureChart: FunctionComponent<RealtimeTemperatureChartProps> = ({ series }) => {
    const options: ApexOptions = {
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
            curve: 'smooth'
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
            max: new Date().getTime(),
            tickAmount: 12,
            labels: {
                format: 'HH:mm'
            }
        },
        yaxis: {
            min: 0,
            max: 30,
            tickAmount: 30,
            labels: {
                formatter: (val: number) => val.toFixed(0)
            }
        },
        legend: {
            show: false
        },
    };

    return (
        <>
            <ReactApexChart options={options} series={series} type="line" height={'90%'} width={'90%'} />
        </>
    )
};

export default RealtimeTemperatureChart;