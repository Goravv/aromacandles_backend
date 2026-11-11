from review_demo.calc import add, divide, average


def test_add():
    assert add(2, 3) == 5


def test_divide_normal():
    assert divide(10, 2) == 5


def test_average():
    assert average([2, 4, 6]) == 4
