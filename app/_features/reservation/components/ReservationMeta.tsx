type ReservationMiniStatProps = {
  label: string;
  value: string;
};

export function ReservationMiniStat({ label, value }: ReservationMiniStatProps) {
  return (
    <div className="space-y-2 px-4 py-4">
      <p className="meta-label">{label}</p>
      <p className="body-copy font-semibold text-foreground">{value}</p>
    </div>
  );
}
