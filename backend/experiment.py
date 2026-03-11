# import fastf1 as ff1
# import json
# ff1.Cache.enable_cache("./cache")

# event = ff1.get_event_schedule(2026)

# print(json.dumps(event, indent=4))   

import fastf1 as ff1
import json
import pandas as pd # FastF1 uses pandas heavily under the hood

ff1.Cache.enable_cache("./cache")

# 1. Get the schedule
event = ff1.get_event_schedule(2026)

# 2. Filter out just the columns we care about for the app
# (Round 0 is Pre-Season Testing, so we skip it by checking RoundNumber > 0)
filtered_events = event[event['RoundNumber'] > 0][['RoundNumber', 'EventName', 'Country', 'EventDate']]

# 3. Convert dates to strings so JSON can read them
filtered_events['EventDate'] = filtered_events['EventDate'].dt.strftime('%Y-%m-%d')

# 4. Convert the DataFrame to a simple list of Python dictionaries
list_of_dicts = filtered_events.to_dict(orient='records')

# 5. NOW we can safely print it as JSON!
print(json.dumps(list_of_dicts, indent=4))
