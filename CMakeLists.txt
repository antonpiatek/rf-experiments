# This configuration file outlines some of the ways Arduino CMake
# can be used. For a detailed explenation of all the options please
# reade README.rst.

set(CMAKE_TOOLCHAIN_FILE arduino-cmake/cmake/ArduinoToolchain.cmake) # Arduino Toolchain
cmake_minimum_required(VERSION 2.8)

project(RFExperiments C CXX)

print_board_list()
print_programmer_list()


set(ARDUINO_DEFAULT_BOARD uno) # Default Board ID, when not specified
set(ARDUINO_DEFAULT_PORT /dev/ttyACM0) # Default Port, when not specified

generate_arduino_firmware(signal_capture
    SKETCH "signal_capture"
    SERIAL picocom @SERIAL_PORT@
    )

generate_arduino_firmware(embedded_send
    SKETCH "embedded_send"
    PORT /dev/ttyACM1
    BOARD "leonardo"
    SERIAL picocom @SERIAL_PORT@
    )


