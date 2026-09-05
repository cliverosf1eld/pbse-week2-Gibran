function toCourtRepresentation(court) {
  return {
    id: court.id,
    name: court.name,
    location: court.location,
    courtType: court.court_type,
    isAvailable: court.is_available,
    status: court.status
  };
}

module.exports = {
  toCourtRepresentation
};
