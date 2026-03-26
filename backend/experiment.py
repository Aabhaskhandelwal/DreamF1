import fastf1 as f1 
import json 
import pandas as pd

f1.Cache.enable_cache('./cache')

event=f1.get_event_schedule(2025)

filtered_event=event[event['RoundNumber']>0][['RoundNumber','EventName']]

list_of=filtered_event.to_dict(orient='records')
print(json.dumps(list_of,indent=4))

