module MeetupGrabber

  module BasicSupport

    def self.included(base)
      base.extend ClassMethods
    end

    module ClassMethods

      attr_accessor :url
      attr_accessor :version
      attr_accessor :api_key

      def setup
        yield self
      end

      def entity_supported?(entity)
        [:open_events].include?(entity)
      end

      def generate_url(entity)
        return null if !entity_supported?(entity)
        "#{url}/#{version}/#{entity}.json?api_key=#{api_key}"
      end
    end

  end

  class Client

    include BasicSupport

    def grab

      url = Client.generate_url(:open_events)

      #uri = URI('http://example.com/index.html')
      #params = { :limit => 10, :page => 3 }
      #uri.query = URI.encode_www_form(params)

      #res = Net::HTTP.get_response(uri)
      #puts res.body if res.is_a?(Net::HTTPSuccess)

    end


  end
end