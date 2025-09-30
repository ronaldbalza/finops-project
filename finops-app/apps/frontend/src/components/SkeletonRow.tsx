export default function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="animate-pulse border-t border-gray-700">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="p-3">
          <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto" />
        </td>
      ))}
    </tr>
  );
}
