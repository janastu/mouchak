import os
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
#README = open(os.path.join(here, 'README.rst')).read()
#CHANGES = open(os.path.join(here, 'CHANGES.rst')).read()

requires = [
    'Flask',
    'pymongo'
    ]

setup(name='mouchak',
      version='0.1',
      description='Web framework',
      license='BSD',
      classifiers=[
        "Development Status :: 1 - pre-alpha",
        "Intended Audience :: Developers",
        "Environment :: Web Environment",
        "License :: OSI Approved :: BSD License",
        "Operating System :: OS Independent",
        "Programming Language :: JavaScript",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: JavaScript",
        "Topic :: Internet",
        "Topic :: Internet :: WWW/HTTP :: Site Management",
        ],
      author='Anon Ray, Arvind',
      url='https://git.pantoto.org/mouchak/mouchak.git',
      keywords='',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      )
