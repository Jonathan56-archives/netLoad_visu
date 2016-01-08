# General imports
import os
import sys
import datetime
import pytz
import numpy
from pyiso import client_factory
import apipyiso
import matplotlib as plt
import pdb


def replace_missing_value(dictio, time):
    # Replace the missing value by the previous or the next ones
    value = None
    valid = True
    count = 0
    while count < 4:
        count += 1
        # Try to pick the previous value
        try:
            value = dictio[time - datetime.timedelta(hours=count)]
        except KeyError:
            valid = False

        # It works let's return this value
        if valid:
            break

        # Else let's pick the next value
        valid = True
        try:
            value = dictio[time + datetime.timedelta(hours=count)]
        except KeyError:
            valid = False
        
        # It works let's return value
        if valid:
            break

    # We did not find any value to use
    if count >= 4:
        value = 0
    return value

# Input data
year = 2015
month = 6
day = 21
client = client_factory('CAISO')

# Grid manager input in local time zone
tz = pytz.timezone('America/Los_Angeles')
start = datetime.datetime(year, month, day-1, 23, 0, 0, 0, tz)
end = datetime.datetime(year, month, day, 23, 0, 0, 0, tz)

# Result in UTC
_, solar, solarth, wind, load = apipyiso.get_solar_wind_load(client, start, end)
result = {'solar': solar, 'solarth':solarth, 'wind':wind, 'load':load}  # Merge everything

# Set timezone back to California and change timestamp to datetime
for category in result:
    for time in [x for x in result[category]]:
        try:
            newTime = time.to_datetime().replace(tzinfo=pytz.utc).astimezone(tz)
        except AttributeError:
            newTime = time
        result[category][newTime] = result[category].pop(time)

# Set desired output timestamp
start2 = datetime.datetime(year, month, day, 0, 0, 0, 0, tz)
timeList = [start2 + datetime.timedelta(hours=i) for i in range(0, 24)]

# Sanity check -- add missing values
missingData = {}
data = {}
for category in result:
    missingData[category] = []
    data[category] = []

for category in result:
    for time in timeList:  # Time in timeList are sorted
        pdb.set_trace()
        if time in result[category]:
            data[category].append(result[category][time])
        else:
            result[category][time] = replace_missing_value(result[category][time], time)
            data[category].append(result[category][time])
            missingData[category].append(time)

plt.subplot(311)
plt.plot(timeList, data['solar'], label='solar')
plt.subplot(312)
plt.plot(timeList, data['wind'], label='wind')
plt.subplot(313)
plt.plot(timeList, data['load'], label='load')

plt.legend()
plt.show()
