require 'singleton'

module Nyaplot

  # DataBase to store instance of Nyaplot::DataFrame
  # Each dataframe will be fetched when Nyaplot::Frame#to_json is excuted
  class DataBase
    include Singleton

    def initialize
      @db = {}
    end

    def add(df)
      @db[df.name] = df
    end

    def fetch(df_name)
      @db[df_name]
    end
  end
end
