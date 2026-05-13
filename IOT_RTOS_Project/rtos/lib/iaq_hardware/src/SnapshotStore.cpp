#include "SnapshotStore.h"

void SnapshotStore::publish(const SensorSample& s) {
  portENTER_CRITICAL(&mux_);
  latest_ = s;
  has_ = true;
  portEXIT_CRITICAL(&mux_);
}

bool SnapshotStore::get(SensorSample& out) const {
  portENTER_CRITICAL(&mux_);
  bool ok = has_;
  if (ok) out = latest_;
  portEXIT_CRITICAL(&mux_);
  return ok;
}
