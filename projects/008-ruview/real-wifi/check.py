"""Regression checks for real-input selection and refusal of missing readings."""
import unittest
from monitor import parse_reading


class RealInputChecks(unittest.TestCase):
    def test_selects_requested_adapter(self):
        output = "Name : Other\nState : connected\nRssi : -20\nName : WLAN\nState : connected\nRssi : -56\n"
        self.assertEqual(parse_reading(output, "WLAN"), -56)

    def test_chinese_status(self):
        self.assertEqual(parse_reading("名称 : WLAN\n状态 : 已连接\nRssi : -60\n", "WLAN"), -60)

    def test_does_not_treat_percentage_as_rssi(self):
        with self.assertRaises(RuntimeError):
            parse_reading("Name : WLAN\nState : connected\nSignal : 82%\n", "WLAN")

    def test_rejects_stale_reading_after_disconnect(self):
        with self.assertRaises(RuntimeError):
            parse_reading("Name : WLAN\nState : disconnected\nRssi : -56\n", "WLAN")

    def test_refuses_missing_adapter(self):
        with self.assertRaises(RuntimeError):
            parse_reading("Name : Other\nState : connected\nRssi : -56\n", "WLAN")

    def test_refuses_invalid_rssi(self):
        for value in ("NaN", "-200", "500", "unknown"):
            with self.subTest(value=value), self.assertRaises(RuntimeError):
                parse_reading(f"Name : WLAN\nState : connected\nRssi : {value}\n", "WLAN")


if __name__ == "__main__":
    unittest.main()
