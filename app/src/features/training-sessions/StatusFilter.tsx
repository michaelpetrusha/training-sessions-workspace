import { STATUS_VALUES } from './types.ts'
import type { TrainingSessionStatus } from './types.ts'

export type StatusFilterValue = 'all' | TrainingSessionStatus

type StatusFilterProps = {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

const FILTER_ID = 'training-sessions-status-filter'

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="training-sessions__filter">
      <label htmlFor={FILTER_ID}>Status</label>
      <select
        id={FILTER_ID}
        name="status"
        value={value}
        onChange={(event) => onChange(event.target.value as StatusFilterValue)}
      >
        <option value="all">All</option>
        {STATUS_VALUES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  )
}
