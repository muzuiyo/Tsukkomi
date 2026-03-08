'use client'
import Link from "next/link";
import "./labelItem.css";

interface LabelItemProps {
    labelName: string,
    count: number,
    username: string
}

const LabelItem = ({labelName, count, username}: LabelItemProps) => {
    return <Link href={`/memos?username=${username}&label=${labelName}`}>
        <div className="label-item-container">
            <div className="label-item-name label-item-meta">
                {labelName}
            </div>
            <div className="label-line">·</div>
            <div className="label-item-count label-item-meta">
                {count}
            </div>
        </div>
    </Link>
}

export default LabelItem;