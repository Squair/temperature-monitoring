import { FunctionComponent } from "react";

interface MeasurementProps {
    name: string;
    value: string;
    centerOffset: string;
}

const Measurement: FunctionComponent<MeasurementProps> = ({ name, value, centerOffset }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: centerOffset }}>
            <p style={{ textAlign: 'center' }}>{name}</p>
            <h1 style={{ padding: 0, margin: 0 }}>{value}%</h1>
        </div>
    )
}

export default Measurement;