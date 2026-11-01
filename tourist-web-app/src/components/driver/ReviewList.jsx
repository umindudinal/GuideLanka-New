export default function ReviewList() {
  const reviews = [
    { name: "John Doe", comment: "Amazing guide! We spotted 2 leopards thanks to his sharp eyes.", date: "July 2026" },
    { name: "Sarah Smith", comment: "Very professional and respectful of the wildlife. Highly recommended.", date: "June 2026" }
  ];

  return (
    <div className="space-y-4">
      {reviews.map((rev, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-900">{rev.name}</span>
            <span className="text-sm text-gray-400">{rev.date}</span>
          </div>
          <p className="text-gray-600 italic">"{rev.comment}"</p>
        </div>
      ))}
    </div>
  );
}
