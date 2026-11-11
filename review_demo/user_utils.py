import sys, json


def validate_email(email):
    return "@" in email


def get_user_name(user_dict):
    return user_dict["name"]


def parse_age(text):
    return int(text)


DEFAULT_MESSAGE = "This is an intentionally very long line used to trigger the line length lint rule in the review bot test, well over one hundred characters."
