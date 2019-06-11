pragma solidity ^0.4.25;

contract TemperatureMonitor {
  int8 public temperature;

  function set(int8 temp) public {
    temperature = temp;
  }

  function get() view public returns (int8) {
    return temperature;
  }
}
