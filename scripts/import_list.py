#!/usr/bin/python3
import sqlite3
import json
import sys
import re

validNames = re.compile('^[a-zA-Z ]+$')

def parse_file_with_validation(file):
    ret = []
    for (idx, line) in enumerate(file):
        name, *roles = line.rstrip('\n').split('|')

        synerror = False

        if not bool(validNames.match(name)):
            synerror = True

        if synerror:
            print("Syntax error at line " + str(idx))
            exit(1)

        if not len(roles) == 0:
            ret.append('(\'{name}\',\'{roles}\')'.format(name=name, roles=','.join(roles)))
        else:
            ret.append('(\'{name}\',\'Student\')'.format(name=name))
    return ret

if len(sys.argv) < 1:
    print("No import file specified")
    exit(1)

config = open("config/config.json")
list_of_names = parse_file_with_validation(open(sys.argv[1]))

print(list_of_names)

exit(0)

database_location = json.load(config)["databaseLocation"]
con = sqlite3.connect(database_location)
cur = con.cursor()

print("Adding list of names to database...")
cur.execute('INSERT INTO Students (fullName, roles) VALUES {}'.format(','.join(list_of_names)))

con.commit()

con.close()
print("Done.")
