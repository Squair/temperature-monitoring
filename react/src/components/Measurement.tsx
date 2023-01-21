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
    const iconStlying = { height: '2em', width: '2em', alignSelf: 'flex-end' };

    return (
        <div style={{ display: 'flex', flexDirection: align === 'left' ? 'row' : 'row-reverse', marginTop: centerOffset }}>
            {isTrendingHigher
                ? <KeyboardDoubleArrowUpIcon sx={{ ...iconStlying }} />
                : <KeyboardDoubleArrowDownIcon sx={{ ...iconStlying }} />}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ textAlign: 'center' }}>{name}</p>
                <h1 style={{ padding: 0, margin: 0 }}>{value}</h1>
            </div>
        </div>
    )
}

export default Measurement;