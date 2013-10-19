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
        "#{url}/#{version}/#{entity}.json"
      end

      def generate_params(params = {})
        uri_params = params.reject { |k,v| [:action].include?(k) }
        uri_params[:key] = api_key
        uri_params
      end
    end

  end

  class Client

    include BasicSupport

    def grab_rough_data(params)
      url = Client.generate_url(:open_events)

      uri = URI(url)
      uri_params = Client.generate_params(params)
      uri.query = URI.encode_www_form uri_params

      Net::HTTP.get_response uri
    end

    def grab(params)
      response = grab_rough_data params



    end


  end
end