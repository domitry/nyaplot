require 'singleton'

module Nyaplot
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
