"""Check real-input failures, bounded collection, and the verified replay."""
import json
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

import web_session


class WebSessionChecks(unittest.TestCase):
    def test_verified_record_keeps_measured_values_and_labels(self):
        replay = web_session.verified_replay()
        self.assertEqual(replay["source"], "real-windows-netsh-rssi")
        self.assertEqual(len(replay["samples"]), 356)
        self.assertEqual({s["rssi_dbm"] for s in replay["samples"]}, {-56, -62})
        self.assertEqual(sum(r["upstream_label"] == "active" for r in replay["reports"]), 4)

    def test_unavailable_hardware_stops_without_fake_samples(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(web_session, "ROOT", Path(directory)), patch.object(web_session, "collect", side_effect=RuntimeError("test disconnect")):
                session = web_session.LiveSession()
                session.start()
                session.thread.join(timeout=3)
                state = session.snapshot()
                self.assertEqual(state["state"], "error")
                self.assertEqual(state["error"], "test disconnect")
                self.assertEqual(state["samples"], [])
                self.assertEqual(state["reports"], [])
                records = list((Path(directory) / "recordings").glob("*.jsonl"))
                self.assertTrue(any(json.loads(line)["type"] == "error" for line in records[0].read_text(encoding="utf-8").splitlines()))

    def test_stop_and_restart_are_bounded_and_do_not_reuse_old_data(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(web_session, "ROOT", Path(directory)), patch.object(web_session, "collect", side_effect=lambda _: (time.time(), -67)):
                session = web_session.LiveSession(duration=2)
                initial = session.start()["session_id"]
                time.sleep(.1)
                stopped = session.stop()
                self.assertEqual(stopped["state"], "stopped")
                self.assertFalse(session.thread.is_alive())
                self.assertTrue(stopped["samples"])
                self.assertFalse(stopped["reports"])
                self.assertEqual(session.start()["state"], "starting")
                self.assertNotEqual(session.session_id, initial)
                session.stop()

    def test_missing_record_is_not_replaced_with_a_simulation(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(web_session, "ROOT", Path(directory)):
                with self.assertRaises(FileNotFoundError):
                    web_session.verified_replay()


if __name__ == "__main__":
    unittest.main()
