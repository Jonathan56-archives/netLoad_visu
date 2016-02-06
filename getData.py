# General imports
from __future__ import division
import datetime
import pytz
import apipyiso
import os
import csv
import matplotlib.pyplot as plt


def get_daily_data(year, month, day, client):
    # Grid manager input in local time zone
    tz = pytz.timezone('America/Los_Angeles')
    start = datetime.datetime(year, month, day, 10, 0, 0, 0, tz) - datetime.timedelta(days=1)
    end = datetime.datetime(year, month, day, 23, 0, 0, 0, tz)

    # Result in UTC
    result = apipyiso.get_load_gen(client, start, end, categories=['solar', 'wind', 'load'])
    # result = apipyiso.get_load_gen(client, start, end)

    # Set timezone back to California --> change timestamp to datetime --> remove timezone
    for category in result:
        for time in [x for x in result[category]]:
            try:
                newTime = time.to_datetime().replace(tzinfo=pytz.utc).astimezone(tz).replace(tzinfo=None)
            except AttributeError:
                newTime = time.replace(tzinfo=pytz.utc).astimezone(tz).replace(tzinfo=None)
            result[category][newTime] = result[category].pop(time)

    # Set desired output timestamp -- from here everything is in local time with no timezone
    start2 = datetime.datetime(year, month, day, 0, 0, 0, 0, tz).replace(tzinfo=None)
    timeList = [start2 + datetime.timedelta(hours=i) for i in range(0, 24)]

    missingData = {}
    data = {}
    for category in result:
        missingData[category] = []
        data[category] = []

    # Append desired value in a list
    for category in result:
        for time in timeList:  # Time in timeList are sorted
            if time in result[category]:
                data[category].append(result[category][time])
            else:
                result[category][time] = replace_missing_value(result[category], time)
                data[category].append(result[category][time])
                missingData[category].append(time)
            if isinstance(data[category][-1], basestring):
                data[category][-1] = -1
    data['time'] = timeList

    # Merge solarpv and solarth into solar
    try:
        data['solar'] = [pv + th for pv, th in zip(data['solarpv'], data['solarth'])]
        del data['solarth']
        del data['solarpv']
    except KeyError:
        pass

    for category in missingData:
        print("There is " + str(len(missingData[category])) + " missing data for " + category)

    return data


def concatenate_day(data, dayData):
    for category in data:
        data[category].extend(dayData[category])

    return data


def replace_missing_value(dictio, time):
    # Replace the missing value by the previous or the next ones
    value = None
    valid = True
    count = 0
    while count < 4:
        count += 1
        try:
            value = dictio[time + datetime.timedelta(hours=count)]
        except KeyError:
            valid = False
        
        # It works let's return value
        if valid:
            break

    # We did not find any value to use
    if count >= 4:
        value = -1
    return value


def save(path, ext='png', close=True, verbose=True):
    """Save a figure from pyplot.
    Parameters
    ----------
    path : string
        The path (and filename, without the extension) to save the
        figure to.
    ext : string (default='png')
        The file extension. This must be supported by the active
        matplotlib backend (see matplotlib.backends module).  Most
        backends support 'png', 'pdf', 'ps', 'eps', and 'svg'.
    close : boolean (default=True)
        Whether to close the figure after saving.  If you want to save
        the figure multiple times (e.g., to multiple formats), you
        should NOT close it in between saves or you will have to
        re-plot it.
    verbose : boolean (default=True)
        Whether to print information about when and where the image
        has been saved.
    """
    
    # Extract the directory and filename from the given path
    directory = os.path.split(path)[0]
    filename = "%s.%s" % (os.path.split(path)[1], ext)
    if directory == '':
        directory = '.'

    # If the directory does not exist, create it
    if not os.path.exists(directory):
        os.makedirs(directory)

    # The final path to save to
    savepath = os.path.join(directory, filename)

    if verbose:
        print("Saving figure to '%s'..." % savepath),

    # Actually save the figure
    plt.savefig(savepath)
    
    # Close it
    if close:
        plt.close()

    if verbose:
        print("Done")


def write_data_as_csv(data, path):
    # Create and open a csv file
    with open(path, 'w') as csvfile:
        writer = csv.writer(csvfile, delimiter=',', lineterminator='\n')
        
        # Make the header
        row = []
        for category in data:
            row.append(category)
        writer.writerow(row)
        
        # Fill the data
        for index in range(0, len(data['time'])):
            row = []
            for category in data:
                # Build the row of values (location, time, ...)
                row.append(data[category][index])
            writer.writerow(row)