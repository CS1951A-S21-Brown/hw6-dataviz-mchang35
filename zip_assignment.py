"""
This file is to check if the folder that the student is trying to submit
is of this exact structure (with exact naming):
| index.html
| data
    | *.csv
| <all the other stuff that you included with no name requirements>

And then it will zip

This code is inspired by the submission zip file created by Professor
James Tompkin (james_topkin@brown.edu) for CSCI 1430 - Brown University.

Adapted by Nam Do (nam_do@brown.edu) - Spring 2021.
"""
from __future__ import with_statement
import sys, os, zipfile, warnings
import contextlib, subprocess

try:
    from urllib.parse import urlencode
except ImportError:
    from urllib import urlencode

try:
    from urllib.request import urlopen
except ImportError:
    from urllib2 import urlopen


# Logistical pieces

warnings.filterwarnings("ignore")

########################################## HELPER FUNCTIONS ##########################################

# Function from https://stackoverflow.com/questions/1724693/find-a-file-in-python
def find(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            return os.path.join(root, name)


# Function adapted from https://www.geeksforgeeks.org/working-zip-files-python/
def get_all_file_paths(directory, ext):
    # Initializing empty file paths list
    file_paths = []

    # Crawling through directory and subdirectories
    for root, directories, files in os.walk(directory):
        for filename in files:
            if filename.endswith(ext):
                # Join the two strings in order to form the full filepath.
                filepath = os.path.join(root, filename)
                file_paths.append(filepath)

    # returning all file paths
    return file_paths


# Function adapted from https://www.geeksforgeeks.org/python-url-shortener-using-tinyurl-api/
def make_tiny(url):
    request_url = ('http://tinyurl.com/api-create.php?' + urlencode({'url':url}))
    with contextlib.closing(urlopen(request_url)) as response:
        return response.read().decode('utf-8')


########################################## MAIN ZIP LOGIC ##########################################
def main():
    # First, check what directory that we're running this from
    curdir = os.getcwd()
    failed = False
    # If the current directory doesn't contain this script, we'll exit and
    # tell the student to chdir to the right directory
    for must_have_file in ["index.html", "main.js", "main.css"]:
        if find(must_have_file, curdir) == None:
            # We haven't found this file, and so we will print out a message and sys exit
            print("We cannot find the file {} in the directory that you are".format(must_have_file))
            print("executing this script from. Please use command 'cd <path>' to change to the right")
            print("directory that contains zip_assignment.py and execute this script again.")
            sys.exit()


    # Alright. Get the name of the repository that they are using
    PATH_TO_SUBMISSIONLINK = "link_to_submission.txt"
    if not os.path.exists(PATH_TO_SUBMISSIONLINK):
        repo_name = curdir.split(os.sep)[-1]
        repo_name_splitted = repo_name.split("-")
        if repo_name_splitted[0] != "hw6" or repo_name_splitted[1] != "dataviz":# or len(repo_name_splitted) < 3:
            # We don't have the correct github username to generate the link to, so we'll fail
            print("The name of the current folder does not match up with the syntax of a \
                    valid github repository.")
            print("Please rename this folder to match up with the name of your repository \
                    on Github. E.g. 'hw6-dataviz-ndo3'")
            sys.exit()
        # else, we will now create a tinyurl to the github pages of this submission
        correct_path = "https://cs1951a-s21-brown.github.io/{}/index.html".format(repo_name)
        # this link will not really be available until you make public your Github Page
        tinyurl = make_tiny(correct_path)
        # also do a binary encoding of your repo name, just in case we cannot get ahold of
        # your link
        binary_enc = ' '.join(format(ord(x), 'b') for x in repo_name)
        # and then output it to PATH_TO_SUBMISSIONLINK
        with open(PATH_TO_SUBMISSIONLINK, "w") as lolfile:
            lolfile.writelines([tinyurl + "\n\n", binary_enc + "\n"])
    
    # alright. Now before we do anything, we'll commit and push
    print(" Committing your code to Github for Github Pages ... ")
    sequence = [ ['git', 'add', '.'] , ['git', 'commit', '-m', '.'] , ['git', 'push']]
    try:
        for sq in sequence:
            ret = subprocess.call(sq)
            if ret != 0:
                print("Error calling git commands to push your code", "EXIT CODE: ", ret)
                print("You will need to push your code to Github manually to be graded.")
    except Exception as e:
        print("Error calling git commands to push your code", "ERROR: ", e)
        print("You will need to push your code to Github manually to be graded.")


    
    # Alright. Now right before submission, we will assert that the PATH_TO_SUBMISSIONLINK
    # exists now
    if not os.path.exists(PATH_TO_SUBMISSIONLINK):
        print("Ruh roh. Something went wrong with zip_assignment.py. Please contact the HTAs.")


    print("Writting into zip file...")
    zip_path = "dataviz-submission-1951A.zip"
    with zipfile.ZipFile(zip_path, "w") as zip:
        for root, dirs, files in os.walk(os.getcwd()):
            # skipping the hidden files
            for e in root.split("/")[1:]:
                if e[0] == ".": break
                for f in files:
                    if f != zip_path and f != "zip_assignment.py" and not(".zip" in f):
                        zip.write(os.path.join(root, f),\
                                    os.path.relpath(os.path.join(root, f),\
                                        os.path.join(zip_path, '..'))\
                                    )


    print("Done! Wrote the submission zip to {}".format(zip_path))






if __name__ == "__main__":
    main()
