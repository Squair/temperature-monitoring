import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { FunctionComponent } from "react";

interface MeasurementProps {
    name: string;
    value: string;
    centerOffset: string;
    isTrendingHigher?: boolean
    align: 'left' | 'right'
}

const Measurement: FunctionComponent<MeasurementProps> = ({ name, value, centerOffset, isTrendingHigher, align }) => {
    const iconStlying = { height: '2em', width: '2em', alignSelf: 'center' };
    const icon = isTrendingHigher
        ? <KeyboardDoubleArrowUpIcon sx={{ ...iconStlying, textAlign: 'center' }} />
        : <KeyboardDoubleArrowDownIcon sx={{ ...iconStlying }} />

    return (
        <div style={{ display: 'flex', marginTop: centerOffset }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ textAlign: 'center' }}>{name}</p>
                <div style={{ display: 'flex', flexDirection: align === 'left' ? 'row' : 'row-reverse' }}>
                    {icon}
                    <h1 style={{ fontSize: '2.5em' }}>{value}</h1>
                </div>
            </div>
        </div>
    )
}

export default Measurement;