# Import main module
from __future__ import division
import getData
from pyiso import client_factory
from calendar import monthrange
import time
import pdb
import os

# Imports useful for graphics
import matplotlib.pyplot as plt
import seaborn
seaborn.set_style("whitegrid")

# Input data
year = 2010

for month in range(1, 13):
	# Set variables
	dayRange = monthrange(year, month)[1]
	dayList = [index for index in range(1, dayRange+1)]
	firstIteration = True
	result = {}
	client = client_factory('CAISO')

	for day in dayList:
		temp = getData.get_daily_data(year, month, day, client)
		if firstIteration:
			firstIteration = False
			for category in temp:
				result[category] = []
		# Add one more day in the final result
		result = getData.concatenate_day(result, temp)
		time.sleep(1)
	 
	# Save to csv
	path = os.path.join(os.path.dirname(__file__), 'csv_result', str(year) + '-' + str(month) + '.csv')
	getData.write_data_as_csv(result, path)

	# Plot data
	plt.figure(figsize=(20, 20), dpi=80)
	nbPlot = 100 * (len(result) - 1) + 10
	for category in result:
	    if not category == 'time':
	        nbPlot += 1
	        plt.subplot(nbPlot)
	        plt.plot(result['time'], result[category], label=category)
	        plt.xlabel('Time')
	        plt.ylabel('Power (MW)')
	        plt.legend()
	path = os.path.join(os.path.dirname(__file__), 'graph_result', str(year) + '-' + str(month))
	getData.save(path, ext='png', close=True, verbose=True)