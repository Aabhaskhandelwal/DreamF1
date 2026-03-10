import fastf1
import matplotlib.pyplot as plt
import numpy as np

# Enable caching
# fastf1.Cache.enable_cache("./cache")

# Load session data
# Example: 2023 Australian Grand Prix, Practice 1
session = fastf1.get_session(2023, 'Australia', 'FP1')
session.load()

# Get lap data
laps = session.laps

# Filter for a specific driver (e.g., Max Verstappen)
ver_laps = laps.pick_driver('VER')

# Get lap times
lap_times = ver_laps['LapTime']

# Convert to seconds for plotting
lap_times_sec = lap_times.total_seconds()

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(lap_times_sec, marker='o', linestyle='-')
plt.title('Max Verstappen Lap Times - 2023 Australian GP FP1')
plt.xlabel('Lap Number')
plt.ylabel('Lap Time (seconds)')
plt.grid(True)
plt.show()

print("Plot generated successfully!")
